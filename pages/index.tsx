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

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [upload, setUpload] = useState<Uploader | null>(null);
  const [progress, setProgress] = useState(0);

  const onFileChanged = e => {
    const file = [ ...e.target.files ][0];

    const uploader = new Uploader({ file })
    .onProgress(({ percentage }) => {
      setProgress(percentage);
    })
    .onComplete((uploadResponse) => {
      console.log('upload complete', uploadResponse);
    })
    .onError((error) => {
      console.error('upload error', error)
    });

    setUpload(uploader);
  };

  const uploadClicked = () => {
    if (!upload) { return }

    upload.start();
  };

  return (
    <div className="mx-auto max-w-7xl sm:p-6 lg:p-8">
      <div className="flex text-sm text-gray-600">
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
            onChange={onFileChanged}
            value={inputValue}
          />
        </label>
      </div>

      <p className="py-2 text-sm text-gray-500">
        Any file up to 5TB
      </p>

      {upload && (
        <div className="py-2 flex flex-grow flex-col">
          <span className="text-sm font-medium text-gray-900">
            { upload.file.name }
          </span>
          <span className="text-sm text-gray-500">
            { upload.file.type }
          </span>
          <span className="text-sm text-gray-500">
            { prettyBytes(upload.file.size) }
          </span>

          <UploadProgressBar
            progress={progress}
          />
        </div>
      )}

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
