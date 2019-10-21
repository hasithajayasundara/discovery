import * as sdk from '@cognite/sdk';

const findAssetFromMappings = (nodeId, mappings) => {
  // See if there are any exact matches for this nodeId
  const assetIds = mappings
    .filter(mapping => mapping.nodeId === nodeId)
    .map(mapping => mapping.assetId);

  if (assetIds.length > 0) {
    // We found at least one exact match. There should not be more than one, but we'll choose the first one.
    const assetId = assetIds[0];

    // Now find all mappings pointing to this assetId as multiple 3D nodes may point to the same assetId.
    // Sort the list in descending order so first element has the largest subtreeSize.
    const filteredMappings = mappings.filter(
      mapping => mapping.assetId === assetId
    );
    return filteredMappings[0].assetId;
  }

  const filteredMappings = mappings.filter(
    mapping => mapping.nodeId !== nodeId
  );
  if (filteredMappings.length > 0) {
    // The node has no direct mapping, choose the next parent
    return findAssetFromMappings(
      filteredMappings[filteredMappings.length - 1].nodeId,
      filteredMappings
    );
  }

  return null;
};

const fetchAssetMappingsFromNodeId = async (modelId, revisionId, nodeId) => {
  const data = await sdk.ThreeD.listAssetMappings(modelId, revisionId, {
    nodeId,
  });

  // Sort in descending order on subtreeSize
  const mappings = data.items.sort((a, b) => b.subtreeSize - a.subtreeSize);

  return mappings;
};

export async function getAssetIdFromNodeId(modelId, revisionId, nodeId) {
  const mappings = await fetchAssetMappingsFromNodeId(
    modelId,
    revisionId,
    nodeId
  );
  const assetId = findAssetFromMappings(nodeId, mappings);
  return assetId;
}