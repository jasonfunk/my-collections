import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { register as registerGetCollectionStats } from './get-collection-stats';
import { register as registerGetRecentAdditions } from './get-recent-additions';
import { register as registerSearchCollection } from './search-collection';
import { register as registerBrowseCatalog } from './browse-catalog';
import { register as registerGetCatalogItem } from './get-catalog-item';
import { register as registerGetOwnedItems } from './get-owned-items';
import { register as registerGetItemDetails } from './get-item-details';
import { register as registerGetWishlist } from './get-wishlist';
import { register as registerAddToCollection } from './add-to-collection';
import { register as registerUpdateItem } from './update-item';
import { register as registerMarkWishlistAcquired } from './mark-wishlist-acquired';
import { register as registerRemoveFromCollection } from './remove-from-collection';
import { register as registerUploadPhoto } from './upload-photo';
import { register as registerAttachPhotoToItem } from './attach-photo-to-item';

export function registerAllTools(server: McpServer): void {
  // COL-134: Global read tools
  registerGetCollectionStats(server);
  registerGetRecentAdditions(server);
  registerSearchCollection(server);

  // COL-135: Catalog and item read tools
  registerBrowseCatalog(server);
  registerGetCatalogItem(server);
  registerGetOwnedItems(server);
  registerGetItemDetails(server);
  registerGetWishlist(server);

  // COL-136: Write tools
  registerAddToCollection(server);
  registerUpdateItem(server);
  registerMarkWishlistAcquired(server);
  registerRemoveFromCollection(server);

  // COL-137: Photo tools
  registerUploadPhoto(server);
  registerAttachPhotoToItem(server);
}
