# GitHub and Zenodo publication

## Prepare the record

Use one repository for both models, with the proposed first software version
`1.0.0`. Confirm the software authors, their order and affiliations, the rights
holder, and the license. Fill `publication/CITATION.cff.example`, then move it to
the root as `CITATION.cff`. Do not publish placeholder names or pretend a DOI exists.

The proposed MIT template is permissive, including commercial reuse, and requires
preserving the copyright and license notices. It is not active until adopted.
Once the rights holder approves it, fill the holder name and place the text in
the repository-root `LICENSE`. Confirm whether the same terms apply to model weights.
The `publication/LICENSE.template` file is only a proposal.

Zenodo requires a license field and defaults to CC-BY. Set it to the license
actually adopted for this software, rather than accepting a mismatched default.

## Publish code and create the DOI

1. Create the desired **public** GitHub repository and upload the package contents
   to its root. Include the source files, weights and finalized citation/license.
2. Sign in to Zenodo and link the intended GitHub account. Enable this repository
   in Zenodo's GitHub integration before creating the formal release.
3. In GitHub, create a **published release** with tag `v1.0.0` from the exact source
   commit you intend the journal to cite. Use a final release, not an unpublished draft.
4. Wait for Zenodo's archive processing to complete. Open the record and confirm
   the author metadata, license, files, release version and the actual DOI.
5. Use the DOI for the exact version evaluated in the manuscript. Keep the GitHub
   tag and commit in the research record. If the archived software later changes,
   publish a new version instead of silently moving the old release tag.
6. Fill the real repository URL and version DOI into the manuscript statement.
   A reserved DOI is not evidence that the archive has been published.

These steps follow the official GitHub/Zenodo integration instructions. Account
permissions and organization approval, where applicable, must belong to the
intended publication owner. Do not send passwords or personal tokens in a chat.

## Metadata files

A completed `CITATION.cff` alone is sufficient for basic software metadata.
The `.zenodo.json.example` template is optional. If you activate both files,
Zenodo uses `.zenodo.json` rather than `CITATION.cff` for archive metadata; keep
author names, license, title and version aligned. Update author metadata before
the formal release. Set the publication date to the real release date.

## Optional GitHub Pages hosting

In the GitHub repository, open **Settings → Pages**, select **Deploy from a
branch**, choose your default branch and `/docs`, then save. Use the actual
URL reported by GitHub. The landing page links to both calculator variants.
This also provides a deployment option independent of the existing Sites host.

Zenodo provides the archived files and DOI. It does not run the interactive
calculators. Cite the repository and DOI in the code-availability statement;
report the live calculator URL separately.

## Official references

- GitHub code archiving and DOI: https://docs.github.com/en/repositories/archiving-a-github-repository/referencing-and-citing-content
- GitHub citation files: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-citation-files
- Zenodo GitHub release archiving: https://help.zenodo.org/docs/github/archive-software/github-upload/
- Zenodo JSON metadata: https://help.zenodo.org/docs/github/describe-software/zenodo-json/
- Zenodo licenses: https://help.zenodo.org/docs/deposit/describe-records/licenses/
- DOI reservation and publication: https://help.zenodo.org/docs/deposit/describe-records/reserve-doi/
- GitHub Pages source: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- MIT terms: https://choosealicense.com/licenses/mit/
