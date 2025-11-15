import process from 'node:process';

const {
  CF_API_TOKEN,
  CF_ACCOUNT_ID,
  CF_WORKER_NAME,
  TARGET_SHA,
  BRANCH,
  CF_DEPLOY_TIMEOUT_MS = '600000',
  CF_DEPLOY_POLL_INTERVAL_MS = '15000',
} = process.env;

if (!CF_API_TOKEN || !CF_ACCOUNT_ID || !CF_WORKER_NAME || !TARGET_SHA) {
  console.error(
    'Missing required environment variables. Ensure CF_API_TOKEN, CF_ACCOUNT_ID, CF_WORKER_NAME, and TARGET_SHA are set.',
  );
  process.exit(1);
}

const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/workers/scripts/${CF_WORKER_NAME}/deployments`;
const timeoutMs = Number(CF_DEPLOY_TIMEOUT_MS);
const pollIntervalMs = Number(CF_DEPLOY_POLL_INTERVAL_MS);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function metadataMatches(metadata, sha, branch) {
  if (!metadata) return false;

  const values = Object.values(metadata).filter((value) => typeof value === 'string');
  const hasCommit = values.some((value) => value?.toLowerCase().startsWith(sha.toLowerCase()));
  if (hasCommit) {
    return true;
  }

  if (!branch) {
    return false;
  }

  const branchKeys = ['branch', 'git_ref', 'git_branch', 'ref'];
  return branchKeys.some((key) => metadata[key] && metadata[key] === branch);
}

function getStatus(deployment) {
  if (!deployment || typeof deployment !== 'object') return null;

  if (deployment.latest_stage?.status) return deployment.latest_stage.status;
  if (deployment.latest_deployment?.status) return deployment.latest_deployment.status;
  if (deployment.status) return deployment.status;

  if (Array.isArray(deployment.stages) && deployment.stages.length > 0) {
    return deployment.stages[deployment.stages.length - 1]?.status ?? null;
  }

  return null;
}

async function waitForDeployment() {
  const deadline = Date.now() + timeoutMs;

  console.log(
    `Waiting for Cloudflare Worker "${CF_WORKER_NAME}" deployment for commit ${TARGET_SHA.slice(0, 7)} (timeout ${
      timeoutMs / 1000
    }s)...`,
  );

  while (Date.now() < deadline) {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success === false) {
      throw new Error(`Cloudflare API error: ${JSON.stringify(data.errors)}`);
    }

    const deployments = Array.isArray(data.result) ? data.result : [];
    const match = deployments.find((deployment) =>
      metadataMatches(deployment?.deployment_trigger?.metadata, TARGET_SHA, BRANCH),
    );

    if (match) {
      const status = getStatus(match);
      console.log(
        `Found deployment ${match.id ?? match.number ?? ''} with status "${status ?? 'unknown'}" for this commit.`,
      );

      if (status === 'success') {
        console.log('Cloudflare deployment is live.');
        return;
      }

      if (status === 'failure') {
        throw new Error('Cloudflare reports the deployment failed.');
      }
    } else {
      console.log('Deployment not found yet; waiting...');
    }

    await sleep(pollIntervalMs);
  }

  throw new Error(`Timed out waiting for Cloudflare deployment after ${timeoutMs / 1000} seconds.`);
}

waitForDeployment().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
