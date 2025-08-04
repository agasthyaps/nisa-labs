import type { Attachment } from 'ai';

import { LoaderIcon } from './icons';

// Helper function to get file type icon
const getFileTypeIcon = (contentType: string) => {
  if (contentType.startsWith('image/')) {
    return '🖼️';
  } else if (contentType === 'application/pdf') {
    return '📄';
  } else if (contentType.includes('spreadsheet') || contentType.includes('excel') || contentType === 'text/csv') {
    return '📊';
  } else if (contentType.includes('wordprocessingml') || contentType.includes('msword')) {
    return '📝';
  } else if (contentType.includes('presentationml') || contentType.includes('powerpoint')) {
    return '📺';
  } else if (contentType.startsWith('text/') || contentType === 'application/json' || contentType === 'application/xml') {
    return '📃';
  } else if (contentType.includes('javascript') || contentType.includes('typescript')) {
    return '💻';
  } else if (contentType === 'text/css') {
    return '🎨';
  } else {
    return '📎';
  }
};

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
}: {
  attachment: Attachment;
  isUploading?: boolean;
}) => {
  const { name, url, contentType } = attachment;

  return (
    <div data-testid="input-attachment-preview" className="flex flex-col gap-2">
      <div className="w-20 h-16 aspect-video bg-muted rounded-md relative flex flex-col items-center justify-center">
        {contentType ? (
          contentType.startsWith('image') ? (
            // NOTE: it is recommended to use next/image for images
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={name ?? 'An image attachment'}
              className="rounded-md size-full object-cover"
            />
          ) : (
            // Display file type icon for non-image files
            <div className="flex flex-col items-center justify-center h-full">
              <span className="text-2xl">{getFileTypeIcon(contentType)}</span>
            </div>
          )
        ) : (
          // Default icon when content type is unknown
          <div className="flex flex-col items-center justify-center h-full">
            <span className="text-2xl">📎</span>
          </div>
        )}

        {isUploading && (
          <div
            data-testid="input-attachment-loader"
            className="animate-spin absolute text-zinc-500"
          >
            <LoaderIcon />
          </div>
        )}
      </div>
      <div className="text-xs text-zinc-500 max-w-16 truncate">{name}</div>
    </div>
  );
};
