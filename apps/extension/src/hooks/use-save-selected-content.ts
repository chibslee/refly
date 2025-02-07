import { UpsertResourceRequest, type BaseResponse } from '@refly/openapi-schema';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { getClientOrigin } from '@refly/utils/url';
import { ConnectionError, ContentTooLargeError, PayloadTooLargeError } from '@refly/errors';

// Maximum content length (100k characters)
const MAX_CONTENT_LENGTH = 100000;
// Maximum payload size (100KB)
const MAX_PAYLOAD_SIZE_BYTES = 100 * 1024;

interface SaveContentMetadata {
  title?: string;
  url?: string;
  res: BaseResponse;
}

export const useSaveSelectedContent = () => {
  const saveSelectedContent = async (
    content: string,
    metadata?: SaveContentMetadata,
  ): Promise<{ url: string; res: BaseResponse }> => {
    try {
      // Get the current page title and URL or use provided metadata
      const title = metadata?.title || document?.title || 'Untitled';
      const url = metadata?.url || document?.location?.href || 'https://www.refly.ai';

      // Check content length
      if (content?.length > MAX_CONTENT_LENGTH) {
        return {
          url: '',
          res: {
            errCode: new ContentTooLargeError().code,
          } as BaseResponse,
        };
      }

      const createResourceData: UpsertResourceRequest = {
        resourceType: 'text',
        title,
        content: content || '',
        data: {
          url,
          title,
        },
      };

      // Check payload size
      const payloadSize = new Blob([JSON.stringify(createResourceData)]).size;
      if (payloadSize > MAX_PAYLOAD_SIZE_BYTES) {
        return {
          url: '',
          res: {
            errCode: new PayloadTooLargeError().code,
          } as BaseResponse,
        };
      }

      const { error } = await getClient().createResource({
        body: createResourceData,
      });

      // const resourceId = data?.data?.resourceId;
      // const resourceUrl = `${getClientOrigin(false)}/resource/${resourceId}`;
      const resourceUrl = `${getClientOrigin(false)}`;

      return {
        url: resourceUrl,
        res: error as BaseResponse,
      };
    } catch (err: any) {
      console.error('Failed to save selected content:', err);
      return {
        url: '',
        res: {
          errCode: new ConnectionError(err)?.code,
        } as BaseResponse,
      };
    }
  };

  return { saveSelectedContent };
};
