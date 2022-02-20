import * as core from '@actions/core';
import * as github from '@actions/github';
import {getInputs, groupByArtifactName, shouldBePurged} from "./utils";
import {GithubApi} from "./github-api";

async function run(): Promise<void> {
  try {
    const inputs = getInputs();
    GithubApi.setOctokit(github.getOctokit(inputs.githubToken));
    const artifacts = await GithubApi.getAllArtifacts(
      github.context.repo.owner,
      github.context.repo.repo,
    );
    const artifactsByName = groupByArtifactName(artifacts);
    const deletedArtifacts: any = [];

    for (const artifactName in artifactsByName) {
      const artifacts = artifactsByName[artifactName];

      if (artifacts.length <= inputs.expireAfter) {
        core.info(`Found only ${artifacts.length} copies of "${artifactName}" artifacts, skipping.`);
        continue;
      }

      for (let i = 0; i < artifacts.length; ++i) {
        const artifact = artifacts[i];
        if (i > inputs.expireAfter || (inputs.expireBy && shouldBePurged(artifact, inputs.artifactNames, inputs.expireBy))) {
          continue;
        }

        deletedArtifacts.push(artifact);
        core.info(`Deleting artifact:\n${JSON.stringify(artifact, null, 2)}`)
        await GithubApi.deleteArtifactById(
          artifact.id,
          github.context.repo.owner,
          github.context.repo.repo,
        );
      }
    }

    core.setOutput('deleted_artifacts', JSON.stringify(deletedArtifacts));
  } catch (err) {
    core.setFailed(err.message);
  }
}

// noinspection JSIgnoredPromiseFromCall
run();
