
tag=$(python -c "import json; print(json.load(open('manifest.json'))['version'])")
git tag -l
tagged=$(git tag -l | grep $tag)
echo $tagged
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