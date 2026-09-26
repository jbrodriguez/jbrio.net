#!/usr/bin/env python3
"""Cross-post one post's cover photo to Pixelfed and record the status id.

Called by scripts/publish, before the post is committed and pushed, so the id
ships inside the post's own commit -- the shape every existing post has:

    python3 scripts/pixelfed_post.py data/posts/202638/index.md

Reads   <dir>/<slug>-full.jpg (the whole frame, not the letterboxed banner)
        plus `alt:` and `description:` from the post's frontmatter.
Posts   POST /api/v1/media      -- the `description` form field IS the alt text
        POST /api/v1/statuses   -- with media_ids[]; Pixelfed rejects text-only
Writes  the returned status id back into the post's `pixelfed:` field, which
        theme/templates/post.html turns into the "show in pixelfed.social" link.

Prints the status id on stdout when it posted, nothing when it skipped.
Human-readable progress goes to stderr so the caller can capture stdout cleanly.

Idempotency: a post whose `pixelfed:` is already non-empty is skipped. That is
what makes a re-run after a failed push safe -- it cannot double-post.

Stdlib only -- no pip install, no virtualenv to keep alive.
"""

import json
import mimetypes
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid

# Pixelfed's own limit, from GET /api/v1/instance -> configuration.media_attachments.
IMAGE_SIZE_LIMIT = 15_360_000


def log(msg):
    print(msg, file=sys.stderr)


def split_frontmatter(text):
    """Return (frontmatter_lines, body_start_index). Raises if there is no block."""
    lines = text.splitlines(keepends=True)
    if not lines or lines[0].strip() != "---":
        raise ValueError("no YAML frontmatter block")
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            return lines, i
    raise ValueError("unterminated YAML frontmatter block")


def read_field(lines, end, key):
    """Read a flat `key: value` out of the frontmatter. '' when absent or empty."""
    prefix = key + ":"
    for line in lines[1:end]:
        if not line.startswith(prefix):
            continue
        value = line[len(prefix):].strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        return value
    return ""


def write_pixelfed_id(path, status_id):
    """Set `pixelfed: '<id>'` in the frontmatter, inserting the line if missing."""
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    lines, end = split_frontmatter(text)
    new_line = "pixelfed: '%s'\n" % status_id
    for i in range(1, end):
        if lines[i].startswith("pixelfed:"):
            lines[i] = new_line
            break
    else:
        lines.insert(end, new_line)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("".join(lines))


def post_multipart(url, token, fields, file_field, file_path):
    """POST a multipart/form-data body. Returns the decoded JSON response."""
    boundary = uuid.uuid4().hex
    sep = ("--" + boundary + "\r\n").encode()
    body = bytearray()
    for name, value in fields.items():
        body += sep
        body += ('Content-Disposition: form-data; name="%s"\r\n\r\n' % name).encode()
        body += value.encode("utf-8") + b"\r\n"
    body += sep
    body += (
        'Content-Disposition: form-data; name="%s"; filename="%s"\r\n'
        % (file_field, os.path.basename(file_path))
    ).encode()
    ctype = mimetypes.guess_type(file_path)[0] or "application/octet-stream"
    body += ("Content-Type: %s\r\n\r\n" % ctype).encode()
    with open(file_path, "rb") as fh:
        body += fh.read()
    body += ("\r\n--" + boundary + "--\r\n").encode()

    req = urllib.request.Request(
        url,
        data=bytes(body),
        headers={
            "Authorization": "Bearer " + token,
            "Content-Type": "multipart/form-data; boundary=" + boundary,
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        return json.load(resp)


def post_form(url, token, pairs):
    """POST an application/x-www-form-urlencoded body. `pairs` is a list of tuples
    so repeated keys like media_ids[] survive."""
    data = urllib.parse.urlencode(pairs).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": "Bearer " + token,
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.load(resp)


def main(argv):
    if len(argv) != 2:
        log("usage: pixelfed_post.py <data/posts/SLUG/index.md>")
        return 2
    post_path = argv[1]

    token = os.environ.get("PIXELFED_ACCESS_TOKEN", "").strip()
    if not token:
        log("PIXELFED_ACCESS_TOKEN is empty -- nothing to do.")
        return 0
    instance = os.environ.get("PIXELFED_INSTANCE_URL", "https://pixelfed.social").rstrip("/")

    with open(post_path, encoding="utf-8") as fh:
        text = fh.read()
    lines, end = split_frontmatter(text)

    slug = os.path.basename(os.path.dirname(post_path))

    # --- the idempotency guard. Without this, a retried push double-posts. ---
    existing = read_field(lines, end, "pixelfed")
    if existing:
        log("%s already has pixelfed: %s -- skipping." % (slug, existing))
        return 0

    image = os.path.join(os.path.dirname(post_path), "%s-full.jpg" % slug)
    if not os.path.exists(image):
        log("%s: no %s-full.jpg -- skipping." % (slug, slug))
        return 0
    size = os.path.getsize(image)
    if size > IMAGE_SIZE_LIMIT:
        log("%s: %s-full.jpg is %d bytes, over Pixelfed's %d limit -- skipping."
            % (slug, slug, size, IMAGE_SIZE_LIMIT))
        return 0

    caption = read_field(lines, end, "description")
    alt = read_field(lines, end, "alt")
    if not alt:
        # Alt text is content. Post anyway rather than block the publish, but be loud.
        log("::warning::%s has no `alt:` -- uploading the photo without alt text." % slug)

    log("%s: uploading %s (%d bytes) to %s" % (slug, os.path.basename(image), size, instance))
    media = post_multipart(
        instance + "/api/v1/media", token, {"description": alt}, "file", image
    )
    media_id = str(media.get("id", ""))
    if not media_id:
        raise RuntimeError("media upload returned no id: %s" % json.dumps(media)[:400])

    log("%s: media id %s -- posting status" % (slug, media_id))
    status = post_form(
        instance + "/api/v1/statuses",
        token,
        [("status", caption), ("media_ids[]", media_id)],
    )
    status_id = str(status.get("id", ""))
    if not status_id:
        raise RuntimeError("status create returned no id: %s" % json.dumps(status)[:400])

    write_pixelfed_id(post_path, status_id)
    log("%s: posted -- %s/p/%s"
        % (slug, instance, status.get("account", {}).get("username", "") + "/" + status_id))
    print(status_id)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv))
    except urllib.error.HTTPError as exc:
        log("HTTP %s from %s: %s" % (exc.code, exc.url, exc.read()[:400]))
        sys.exit(1)
