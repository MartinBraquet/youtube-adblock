tag=$(python -c "import json; print(json.load(open('manifest.json'))['version'])")
echo "Tagging release $tag"
tagged=$(git tag -l $tag)
if [ -z "$tagged" ]; then
  export TAG=$tag
else
  echo "Tag $tag already exists"
fi