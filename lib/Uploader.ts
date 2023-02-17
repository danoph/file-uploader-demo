import axios from "axios"

const API_BASE_URL = "/api/";

const api = axios.create({
  baseURL: API_BASE_URL,
});

interface Part {
  ETag: string
  PartNumber: number
}

interface IOptions {
  chunkSize?: number;
  threadsQuantity?: number;
  file: File;
}

// original source: https://github.com/pilovm/multithreaded-uploader/blob/master/frontend/uploader.js
export class Uploader {
  chunkSize: number;
  threadsQuantity: number;
  file: File;
  aborted: boolean;
  uploadedSize: number;
  progressCache: any;
  activeConnections: any;
  parts: any[];
  uploadedParts: any[];
  uploadId: string | null;
  fileKey: string | null;
  onProgressFn: (progress) => void;
  onErrorFn: (err) => void;
  onCompleteFn: (response) => void;

  constructor(options: IOptions) {
    // this must be bigger than or equal to 5MB,
    // otherwise AWS will respond with:
    // "Your proposed upload is smaller than the minimum allowed size"
    this.chunkSize = options.chunkSize || 1024 * 1024 * 5
    // number of parallel uploads
    this.threadsQuantity = Math.min(options.threadsQuantity || 5, 15)
    this.file = options.file
    this.aborted = false
    this.uploadedSize = 0
    this.progressCache = {}
    this.activeConnections = {}
    this.parts = []
    this.uploadedParts = []
    this.uploadId = null
    this.fileKey = null
    this.onProgressFn = (progress) => console.log('progress', progress);
    this.onErrorFn = (err) => console.log('err', err);
    this.onCompleteFn = (response) => console.log('response', response);
  }

  start() {
    this.initialize()
  }

  async initialize() {
    try {
      const { data: { uploadId, fileKey } } = await api.request({
        url: "/multipart_uploads",
        method: "POST",
        data: {
          filename: this.file.name,
        },
      })

      this.uploadId = uploadId;
      this.fileKey = fileKey;

      const numberOfParts = Math.ceil(this.file.size / this.chunkSize)

      this.parts.push(
        ...[...Array(numberOfParts).keys()].map((val, index) => ({
          PartNumber: index + 1
        }))
      );

      this.sendNext();
    } catch (error) {
      await this.complete(error)
    }
  }

  sendNext() {
    const activeConnections = Object.keys(this.activeConnections).length

    if (activeConnections >= this.threadsQuantity) {
      return
    }

    if (!this.parts.length) {
      if (!activeConnections) {
        this.complete()
      }

      return;
    }

    const part = this.parts.pop();

    if (this.file && part) {
      const sentSize = (part.PartNumber - 1) * this.chunkSize
      const chunk = this.file.slice(sentSize, sentSize + this.chunkSize)

      const sendChunkStarted = () => {
        this.sendNext()
      }

      this.sendChunk(chunk, part, sendChunkStarted)
        .then(() => {
          this.sendNext()
        })
        .catch((error) => {
          this.parts.push(part)
          this.complete(error)
        })
    }
  }

  // terminating the multipart upload request on success or failure
  async complete(error: unknown | undefined = null) {
    if (error && !this.aborted) {
      this.onErrorFn(error)
      return
    }

    if (error) {
      this.onErrorFn(error)
      return
    }

    try {
      const response = await this.sendCompleteRequest()
      this.onCompleteFn(response);
    } catch (error) {
      this.onErrorFn(error)
    }
  }

  // finalizing the multipart upload request on success by calling
  // the finalization API
  async sendCompleteRequest() {
    if (this.uploadId && this.fileKey) {
      const response = await api.request({
        url: `/multipart_uploads/${this.uploadId}/completions`,
        method: "POST",
        data: {
          key: this.fileKey,
          parts: this.uploadedParts,
        },
      })

      return response.data;
    }
  }

  sendChunk(chunk, part, sendChunkStarted): Promise<void> {
    return new Promise((resolve, reject) => {
      this.upload(chunk, part, sendChunkStarted)
        .then((status) => {
          if (status !== 200) {
            reject(new Error("Failed chunk upload"))
            return
          }

          resolve()
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  // calculating the current progress of the multipart upload request
  handleProgress(part, event) {
    //console.log('part', part, 'event', event);
    if (this.file) {
      if (event.type === "progress" || event.type === "error" || event.type === "abort") {
        this.progressCache[part] = event.loaded
      }

      if (event.type === "uploaded") {
        this.uploadedSize += this.progressCache[part] || 0
        delete this.progressCache[part]
      }

      const inProgress = Object.keys(this.progressCache)
        .map(Number)
        .reduce((memo, id) => (memo += this.progressCache[id]), 0)

      const sent = Math.min(this.uploadedSize + inProgress, this.file.size)

      const total = this.file.size

      const percentage = Math.round((sent / total) * 100)

      this.onProgressFn({
        sent: sent,
        total: total,
        percentage: percentage,
      })
    }
  }

  upload(file, part, sendChunkStarted) {
    return new Promise(async (resolve, reject) => {
      if (this.uploadId && this.fileKey) {
        // we need to get the multipart chunk url immediately before starting the upload
        // since creating them beforehand may result in the urls expiring
        const { data: { signedUrl } } = await api.request({
          url: `/multipart_uploads/${this.uploadId}/part_url`,
          method: "POST",
          data: {
            fileKey: this.fileKey,
            partNumber: part.PartNumber,
          }
        })

        // - 1 because PartNumber is an index starting from 1 and not 0
        const xhr = (this.activeConnections[part.PartNumber - 1] = new XMLHttpRequest())

        sendChunkStarted()

        const progressListener = this.handleProgress.bind(this, part.partNumber - 1)

        xhr.upload.addEventListener("progress", progressListener)

        xhr.addEventListener("error", progressListener)
        xhr.addEventListener("abort", progressListener)
        xhr.addEventListener("loadend", progressListener)

        xhr.open("PUT", signedUrl)

        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4 && xhr.status === 200) {
            // retrieving the ETag parameter from the HTTP headers
            const ETag = xhr.getResponseHeader("etag")

            if (ETag) {
              const uploadedPart = {
                PartNumber: part.PartNumber,
                // removing the " enclosing carachters from
                // the raw ETag
                ETag: ETag.replaceAll('"', ""),
              }

              this.uploadedParts.push(uploadedPart)

              resolve(xhr.status)
              delete this.activeConnections[part.PartNumber - 1]
            }
          }
        }

        xhr.onerror = (error) => {
          console.log('xhr error', error);
          reject(error)
          delete this.activeConnections[part.PartNumber - 1]
        }

        xhr.onabort = () => {
          console.log('xhr abort');
          reject(new Error("Upload canceled by user"))
          delete this.activeConnections[part.PartNumber - 1]
        }

        xhr.send(file)
      }
    })
  }

  onProgress(onProgress) {
    this.onProgressFn = onProgress
    return this
  }

  onComplete(onComplete) {
    this.onCompleteFn = onComplete
    return this
  }

  onError(onError) {
    this.onErrorFn = onError
    return this
  }

  abort() {
    Object.keys(this.activeConnections)
      .map(Number)
      .forEach((id) => {
        this.activeConnections[id].abort()
      })

    this.aborted = true
  }
}
