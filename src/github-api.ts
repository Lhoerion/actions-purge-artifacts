import {components} from "@octokit/openapi-types";
import {GitHub} from "@actions/github/lib/utils";

export class GithubApi {
  private static _octokit: InstanceType<typeof GitHub>;

  static setOctokit(value: InstanceType<typeof GitHub>) {
    this._octokit = value;
  }

  private static assertOctokitInstance(): void {
    if (this._octokit) return;
    throw new Error("Assertion failed: Expected Octokit instance to be set.");
  }

  public static async getAllArtifacts(
    repoOwner: string,
    repoName: string,
  ): Promise<components["schemas"]["artifact"][]> {
    this.assertOctokitInstance();
    let hasNextPage = false;
    let currentPage = 1;
    const pageMaxItems = 100;
    const artifacts: components["schemas"]["artifact"][] = [];
    do {
      const response = await this._octokit.rest.actions.listArtifactsForRepo({
        owner: repoOwner,
        repo: repoName,
        page: currentPage,
        per_page: pageMaxItems,
      });
      hasNextPage = response.data.total_count / pageMaxItems > currentPage;
      artifacts.push(...response.data.artifacts);
    } while (hasNextPage);

    return artifacts;
  }

  public static async deleteArtifactById(
    artifactId: number,
    repoOwner: string,
    repoName: string,
  ): Promise<any> {
    return await this._octokit.rest.actions.deleteArtifact({
      owner: repoOwner,
      repo: repoName,
      artifact_id: artifactId,
    });
  }
}