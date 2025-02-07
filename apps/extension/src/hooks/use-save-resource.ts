import { CreateResourceData, type BaseResponse } from '@refly/openapi-schema';
import { getMarkdown, getReadabilityMarkdown } from '@refly/utils/html2md';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { getClientOrigin } from '@refly/utils/url';
import { getRuntime } from '@refly/utils/env';
import { ConnectionError, ContentTooLargeError, PayloadTooLargeError } from '@refly/errors';

// Maximum content length (100k characters)
const MAX_CONTENT_LENGTH = 100000;
// Maximum payload size (100KB)
const MAX_PAYLOAD_SIZE_BYTES = 100 * 1024;

export const useSaveCurrentWeblinkAsResource = () => {
  const saveResource = async () => {
    try {
      const runtime = getRuntime();
      const isWeb = runtime === 'web';
      const pageContent = isWeb
        ? getMarkdown(document?.body)
        : getReadabilityMarkdown(document?.body ? document?.body : document);

      // Check content length
      if (pageContent?.length > MAX_CONTENT_LENGTH) {
        return {
          url: '',
          res: {
            errCode: new ContentTooLargeError().code,
          } as BaseResponse,
        };
      }

      const resource = {
        resourceId: 'tempResId',
        title: document?.title || '',
        data: {
          url: location.href,
          title: document?.title || '',
        },
        resourceType: 'weblink',
        isPublic: false,
        readOnly: true,
        collabEnabled: false,
        content: pageContent || '',
      };

      const createResourceData: CreateResourceData = {
        body: {
          title: resource?.title,
          resourceType: 'weblink',
          data: resource?.data,
          content: resource?.content,
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

      const { error } = await getClient().createResource(createResourceData);
      // const resourceId = data?.data?.resourceId;
      // const url = `${getClientOrigin(false)}/resource/${resourceId}`;
      const url = `${getClientOrigin(false)}`;

      return { url, res: error as BaseResponse };
    } catch (err: any) {
      console.error(err);

      return {
        url: '',
        res: {
          errCode: new ConnectionError(err).code,
        } as BaseResponse,
      };
    }
  };

  return { saveResource };
};
