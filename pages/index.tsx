import { useState } from 'react';
import { Uploader } from '@/lib/Uploader';
import prettyBytes from 'pretty-bytes';

const UploadProgressBar = ({ progress }) => (
  <div className="py-5">
    <div className="w-full bg-gray-200 rounded-full">
      <div
        className={`${
          progress === 0 ?
            'invisible'
            : ''
        } bg-indigo-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full`}
        style={{ width: progress + "%" }}>
        {progress}%
      </div>
    </div>
  </div>
);

interface FileUpload {
  uploader: Uploader;
  progress: number;
}

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [draggingOver, setDraggingOver] = useState(false);

  const updateProgress = (filename, percentage) => {
    setUploads(state =>
      state.map(fileUpload =>
        fileUpload.uploader.file.name === filename
        ? { ...fileUpload, progress: percentage }
        : fileUpload
      )
    );
  };

  const addFiles = files => {
    setUploads(
      files.map(file => ({
        uploader: new Uploader({ file })
        .onProgress(({ percentage }) => {
          updateProgress(file.name, percentage);
        })
        .onComplete((uploadResponse) => {
          console.log('upload complete', uploadResponse);
        })
        .onError((error) => {
          console.error('upload error', error)
        }),
        progress: 0
      }))
    );
  };

  const onFilesChanged = e => {
    const files = [ ...e.target.files ];
    addFiles(files);
  };

  const uploadClicked = () => {
    if (!uploads.length) { return }

    uploads.forEach(upload => upload.uploader.start());
  };

  const stopEvent = e => {
    e.preventDefault();
    e.stopPropagation();
  }

  const handleDragEnter = e => {
    stopEvent(e);
  };

  const handleDragLeave = e => {
    stopEvent(e);
    setDraggingOver(false);
  };

  const handleDragOver = e => {
    stopEvent(e);
    setDraggingOver(true);
  };

  const handleDrop = e => {
    stopEvent(e);
    setDraggingOver(false);
    const files = [ ...e.dataTransfer.files ];
    addFiles(files);
  };

  return (
    <div className="mx-auto max-w-7xl sm:p-6 lg:p-8">
      <div className="flex text-sm text-gray-600">
        <div className="w-full">
          <div
            className={`${draggingOver
              ? "border-blue-500"
              : "border-gray-300"
            } mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            <label
              htmlFor="file-upload"
              className="inline-flex items-center rounded border border-transparent bg-indigo-100 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <div className="text-md">
                Choose File
              </div>
              <input
                id="file-upload"
                name="files"
                type="file"
                className="sr-only"
                onChange={onFilesChanged}
                multiple
                accept="image/*"
                value={inputValue}
              />
            </label>
            <p className="pl-1 text-sm">or drag and drop</p>
          </div>
        </div>
      </div>

      <p className="py-2 text-sm text-gray-500">
        Any file up to 5TB
      </p>

      {uploads.map(({ uploader: { file }, progress }) => (
        <div key={file.name} className="py-2 flex flex-grow flex-col">
          <span className="text-sm font-medium text-gray-900">
            { file.name }
          </span>
          <span className="text-sm text-gray-500">
            { file.type }
          </span>
          <span className="text-sm text-gray-500">
            { prettyBytes(file.size) }
          </span>

          <UploadProgressBar
            progress={progress}
          />
        </div>
      ))}

      <button
        type="button"
        className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        onClick={uploadClicked}
      >
        Upload File
      </button>
    </div>
  )
}
