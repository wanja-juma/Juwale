import { useState } from "react";

import { uploadProductImage } from "../services/admin";

export default function ProductImageUpload({
  onUploaded,
  onUploadingChange,
  disabled = false,
}) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleUpload() {
    if (!file || uploading || disabled) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Choose an image that is 5 MB or smaller.");
      return;
    }

    setUploading(true);
    onUploadingChange(true);
    setError("");
    setNotice("");

    try {
      const data = await uploadProductImage(file);

      onUploaded(data.image_url);

      setNotice(
        "Image uploaded. Click Save product to attach it."
      );
    } catch (error) {
      setError(error.message || "Unable to upload the image.");
    } finally {
      setUploading(false);
      onUploadingChange(false);
    }
  }

  return (
    <div className="product-image-upload">
      <label htmlFor="product-image-file">
        Select a product image
      </label>

      <input
        id="product-image-file"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={uploading || disabled}
        onChange={(event) => {
          setFile(event.target.files?.[0] || null);
          setError("");
          setNotice("");
        }}
      />

      <p>JPEG, PNG, or WebP. Maximum 5 MB.</p>

      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || uploading || disabled}
      >
        {uploading ? "Uploading…" : "Upload image"}
      </button>

      {notice && <p role="status">{notice}</p>}

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}