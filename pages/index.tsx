import { useState } from 'react';
import { Uploader } from '@/lib/Uploader';

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [upload, setUpload] = useState<Uploader | null>(null);

  const onFileChanged = e => {
    const file = [ ...e.target.files ][0];
    const uploader = new Uploader({ file })
    .onProgress(({ percentage }) => {
      console.log('upload progress', percentage);
    })
    .onComplete((uploadResponse) => {
      console.log('upload complete', uploadResponse);
    })
    .onError((error) => {
      console.error('upload error', error)
    });

    setUpload(uploader);

    uploader.start();
  };

  return (
    <div className="mx-auto max-w-7xl sm:p-6 lg:p-8">
      <div className="flex text-sm text-gray-600">
        <label
          htmlFor="file-upload"
          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <div className="text-lg">
            Upload a file
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
    </div>
  )
}
