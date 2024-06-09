set -e

tag=$(python -c "import json; print(json.load(open('manifest.json'))['version'])")
echo "Tagging release $tag"
tagged=$(git tag -l | grep $tag)
if [ -z "$tagged" ]; then
  git tag -a $tag -m "Release $tag"
  git push origin $tag
  echo "Tagged release $tag"

  gh release create "$tag" \
      --repo="$GITHUB_REPOSITORY" \
      --title="${GITHUB_REPOSITORY#*/} ${tag#v}" \
      --generate-notes
  echo "Created release"
else
  echo "Tag $tag already exists"
fi