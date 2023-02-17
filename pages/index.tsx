import { useState } from 'react';

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [upload, setUpload] = useState(null);

  const onFileChanged = e => {
    setUpload(
      new Uploader({
        fileName: e.target.files[0].name,
        file: e.target.files[0],
      })
    );
  };

  return (
    <div className="mx-auto max-w-7xl sm:p-6 lg:p-8">
      <div className="flex text-sm text-gray-600">
        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
          <span>Upload a file</span>
          <input
            id="file-upload"
            name="files"
            type="file"
            className="sr-only"
            onChange={onFileChanged}
            value={inputValue}
          />
        </label>
        <p className="pl-1">or drag and drop</p>
      </div>

      <p className="text-xs text-gray-500">
        Any file up to 5TB
      </p>
    </div>
  )
}
