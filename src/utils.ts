import type {components} from "@octokit/openapi-types";
import parse from "parse-duration";
import * as core from "@actions/core";

export interface ArtifactGroups {
  [name: string]: components["schemas"]["artifact"][];
}

export interface Inputs {
  githubToken: string;
  expireBy: Date | null;
  expireAfter: number;
  artifactNames: string[];
}

export function shouldBePurged(
  artifact: components["schemas"]["artifact"],
  artifactNames: string[],
  expireBy: Date,
): boolean {
  return (!artifactNames.length || artifactNames.includes(artifact.name)) &&
    (Date.now() - new Date(artifact.created_at!).getMilliseconds()) >= expireBy.getMilliseconds();
}

export function getInputs(): Inputs {
  const githubToken = core.getInput('github_token', {required: true});
  const expireStrategy = core.getInput('expire_strategy', {required: true});
  const artifactNames = core.getInput('artifact_name', {required: false})
    .split(/\r?\n/)
    .filter(name => name)
    .map(name => name.trim());
  let expireBy: Date | null = null;
  let expireAfter: number = 0;
  if (Number.isNaN(expireStrategy)) {
    expireBy = new Date(parse(expireStrategy));
  } else {
    expireAfter = Math.max(0, Number.parseInt(expireStrategy, 10));
  }
  return {
    githubToken,
    expireBy,
    expireAfter,
    artifactNames,
  };
}

export function groupByArtifactName(artifacts: components["schemas"]["artifact"][]): ArtifactGroups {
  const stack: ArtifactGroups = {};

  for (const artifact of artifacts) {
    if (!stack[artifact.name]) {
      stack[artifact.name] = [];
    }
    stack[artifact.name].push(artifact);
  }

  return stack;
}
