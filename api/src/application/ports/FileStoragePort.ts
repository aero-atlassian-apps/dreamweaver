/**
 * FileStoragePort - Interface for file storage services
 */

export interface FileStoragePort {
    /**
     * Upload a file and return its public URL.
     * @param fileData - The file content (Buffer or ArrayBuffer)
     * @param path - The destination path (e.g., 'users/123/sample.wav')
     * @param contentType - MIME type of the file
     * @returns The public URL where the file can be accessed.
     */
    upload(fileData: ArrayBuffer | Uint8Array, path: string, contentType: string): Promise<string>
}
