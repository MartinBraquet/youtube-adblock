set -e

tag=$(python -c "import json; print(json.load(open('manifest.json'))['version'])")
tagged=$(git tag -l $tag)
if [ -z "$tagged" ]; then
  git tag -a "$tag" -m "Release $tag"
  git push origin "$tag"
  echo "Tagged release $tag"

  gh release create "$tag" \
      --repo="$GITHUB_REPOSITORY" \
      --title="$tag" \
      --generate-notes
  echo "Created release"
else
  echo "Tag $tag already exists"
fi