'use client'
import axios from "axios";
import { ChangeEvent } from "react";

async function uploadToS3(e: ChangeEvent<HTMLFormElement>) {
  const formData = new FormData(e.target);

  const file = formData.get("file");

  if (!file) {
    return null;
  }

  const fileType = file instanceof File ? encodeURIComponent(file.type) : "";

  const { data } = await axios.get(`/api/s3-upload?fileType=${fileType}`);

  const { uploadUrl, key } = data;

  await axios.put(uploadUrl, file);

  return key;
}

function Upload() {
  async function handleSubmit(e: ChangeEvent<HTMLFormElement>) {
    e.preventDefault();

    const key = await uploadToS3(e);
    console.log(key);
  }

  return (
    <>
      <p>Please select file to upload</p>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/jpeg image/png" name="file" />
        <button type="submit">Upload</button>
      </form>
    </>
  );
}

export default Upload;