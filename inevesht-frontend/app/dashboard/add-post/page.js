"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createPost, uploadImage  } from "../../services/api";

// Dynamically import ReactQuill to avoid SSR issues (Quill requires browser APIs)
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";


export default function AddPostPage() {
  const router = useRouter();
  const quillRef = useRef(null);

  // Form state: holds all fields required to create a new post
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    status: "public",
    thumbnail: null,
  });

  // UI feedback states for error/success messages and submit loading indicator
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect unauthenticated users to the login page on mount
  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) router.push("/login");
  }, [router]);

  // Generic change handler for text inputs, selects, and file inputs
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "thumbnail") {
      // Store the raw File object for multipart upload
      setFormData({ ...formData, thumbnail: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Syncs the Quill editor's HTML output back into form state
  const handleEditorChange = (content) => {
    setFormData({ ...formData, body: content });
  };

  // Custom Quill toolbar handler: opens a file picker, uploads the image,
  // then embeds the returned URL at the current cursor position in the editor
  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      // Retrieve auth token from whichever storage strategy was used at login
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      try {
        const imageUrl = await uploadImage(token, file);
        if (!imageUrl) { alert("سرور لینکی برنگرداند!"); return; }

        // Insert the uploaded image as an embed at the current cursor position
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, "image", imageUrl);
      } catch (err) {
        alert("خطا در آپلود عکس: " + err.message);
      }
    };
  }, []);

  // Memoized toolbar config to prevent unnecessary Quill re-initializations;
  // wires the custom imageHandler into the toolbar's image button
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike", "blockquote"],
        [{ list: "ordered" }, { list: "bullet" }, { direction: "rtl" }],
        ["link", "image"],
        ["clean"],
      ],
      handlers: { image: imageHandler },
    },
  }), [imageHandler]);

  // Builds a FormData payload and submits the new post to the API;
  // resets the form on success and redirects to the home page after a short delay
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setIsLoading(true);

    // Retrieve auth token from whichever storage strategy was used at login
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    const data = new FormData();
    data.append("title", formData.title);
    data.append("body", formData.body);
    data.append("status", formData.status);
    // Only append thumbnail if the user selected a file
    if (formData.thumbnail) data.append("thumbnail", formData.thumbnail);

    try {
      await createPost(token, data);
      setSuccess("پست با موفقیت ایجاد شد!");
      // Reset all form fields after successful creation
      setFormData({ title: "", body: "", status: "public", thumbnail: null });
      // Redirect to home after a short delay so the success message is visible
      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      setError(err.message || "خطا در ایجاد پست");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ap-page" dir="rtl">
      <div className="ap-card">

        {/* ── Header ── */}
        <div className="ap-header">
          <div className="ap-header-icon">
            {/* Pencil / edit icon */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
            </svg>
          </div>
          <h2 className="ap-title">افزودن مقاله جدید</h2>
          <p className="ap-subtitle">محتوای مقاله را وارد کنید و منتشر کنید</p>
        </div>

        {/* ── Alerts ── */}
        {/* Conditionally render error or success feedback banners */}
        {error   && <div className="ap-alert ap-alert-error">{error}</div>}
        {success && <div className="ap-alert ap-alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="ap-form">

          {/* Post title field */}
          <div className="ap-field">
            <label className="ap-label">عنوان مقاله</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="عنوان مقاله را بنویسید..."
              className="ap-input"
            />
          </div>

          {/* Rich-text body editor (Quill) */}
          <div className="ap-field">
            <label className="ap-label">متن مقاله</label>
            <div className="ap-editor-wrap">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={formData.body}
                onChange={handleEditorChange}
                modules={modules}
                className="ap-editor"
                dir="rtl"
              />
            </div>
          </div>

          {/* Publication status selector and cover image uploader side by side */}
          <div className="ap-row">

            {/* Publication status: public or private */}
            <div className="ap-field">
              <label className="ap-label">وضعیت انتشار</label>
              <select name="status" value={formData.status} onChange={handleChange} className="ap-input">
                <option value="public">🌐 عمومی</option>
                <option value="private">🔒 خصوصی</option>
              </select>
            </div>

            {/* Cover image: custom-styled label wraps a hidden native file input */}
            <div className="ap-field">
              <label className="ap-label">تصویر کاور</label>
              <label className="ap-file-label">
                {/* Upload / arrow-up icon */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                {/* Show the selected filename once a file is chosen */}
                <span>{formData.thumbnail ? formData.thumbnail.name : "انتخاب تصویر..."}</span>
                {/* Hidden native file input, triggered by the styled label above */}
                <input
                  type="file"
                  name="thumbnail"
                  onChange={handleChange}
                  accept="image/*"
                  required
                  className="ap-file-input"
                />
              </label>
            </div>
          </div>

          {/* Submit button: shows a spinner and alternate label while the request is in flight */}
          <button type="submit" disabled={isLoading} className="ap-submit">
            {isLoading ? (
              <>
                <span className="ap-btn-spinner" />
                در حال ارسال...
              </>
            ) : (
              <>
                {/* Send / paper-plane icon */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
                انتشار مقاله
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
