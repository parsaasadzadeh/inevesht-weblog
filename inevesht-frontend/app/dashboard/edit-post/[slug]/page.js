"use client";

import { useState, useEffect, useRef, useMemo, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getSinglePost, editPost, uploadImage } from "../../../services/api";

// Dynamically import ReactQuill to avoid SSR issues (Quill requires browser APIs)
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

export default function EditPostPage({ params }) {
  const router = useRouter();
  // Unwrap the async params object using React's `use()` hook
  const resolvedParams = use(params);
  const { slug } = resolvedParams;
  const quillRef = useRef(null);

  // Form state: holds all editable fields for the post
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    status: "public",
    thumbnail: null,
  });

  // Stores the existing thumbnail filename returned from the server
  const [currentImage, setCurrentImage] = useState("");

  // UI state: tracks loading, saving, and feedback messages
  const [pageStatus, setPageStatus] = useState({
    loading: true,
    saving: false,
    error: "",
    success: "",
  });

  /* ── Fetch post ── */
  // On mount, decode the URL slug and fetch the corresponding post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const decodedSlug = decodeURIComponent(slug);
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const data = await getSinglePost(decodedSlug, token);
        const post = data.post;

        // Populate form fields with existing post data
        setFormData({
          title: post.title,
          body: post.body,
          status: post.status,
          thumbnail: null, // Keep null; user must explicitly choose a new image
        });
        // Save the current thumbnail path for preview purposes
        setCurrentImage(post.thumbnail);
      } catch (err) {
        setPageStatus(prev => ({ ...prev, error: "خطا در دریافت اطلاعات مقاله" }));
      } finally {
        // Always turn off the loading state, regardless of success or failure
        setPageStatus(prev => ({ ...prev, loading: false }));
      }
    };
    fetchPost();
  }, [slug]);

  /* ── Handlers ── */
  // Generic change handler for text inputs, selects, and file inputs
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "thumbnail") {
      // Store the selected File object for multipart upload
      setFormData(prev => ({ ...prev, thumbnail: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Syncs the Quill editor's HTML content back into form state
  const handleEditorChange = (content) => {
    setFormData(prev => ({ ...prev, body: content }));
  };

  /* ── Image upload inside editor ── */
  // Custom Quill toolbar handler: opens a file picker and uploads the image,
  // then inserts the returned URL directly into the editor at the cursor position
  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      // Retrieve auth token from whichever storage strategy was used at login
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      try {
        const imageUrl = await uploadImage(token, file);
        if (!imageUrl) { alert("سرور لینکی برنگرداند!"); return; }

        // Insert the uploaded image URL as an embed at the current cursor position
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, "image", imageUrl);
      } catch (err) {
        alert("خطا در آپلود عکس: " + err.message);
      }
    };
  }, []);

  /* ── Quill modules ── */
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

  /* ── Submit ── */
  // Builds a FormData payload and sends the PATCH/PUT request to update the post;
  // omits thumbnail if the user didn't select a new file (server keeps the old one)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setPageStatus(prev => ({ ...prev, saving: true, error: "", success: "" }));

    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    const data = new FormData();
    data.append("title",  formData.title);
    data.append("body",   formData.body);
    data.append("status", formData.status);
    // Only append thumbnail when the user explicitly chose a new image
    if (formData.thumbnail) data.append("thumbnail", formData.thumbnail);

    try {
      await editPost(token, slug, data);
      setPageStatus(prev => ({
        ...prev,
        saving: false,
        success: "مقاله با موفقیت ویرایش شد!",
      }));
      // Redirect to dashboard after a short delay so the success message is visible
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err) {
      setPageStatus(prev => ({
        ...prev,
        saving: false,
        error: err.message || "خطا در ویرایش مقاله",
      }));
    }
  };

  /* ══════════════════ RENDER ══════════════════ */

  // Show a full-screen spinner while the post data is being fetched
  if (pageStatus.loading) return (
    <div className="ep-loading-screen">
      <div className="ep-loading-spinner" />
      <p>در حال بارگذاری اطلاعات مقاله...</p>
    </div>
  );

  return (
    <div className="ep-page" dir="rtl">
      <div className="ep-card">

        {/* ── Header ── */}
        <div className="ep-header">
          <div className="ep-header-bg" />
          <div className="ep-header-icon">
            {/* Pencil / edit icon */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none"
              viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652
                   L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685
                   a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931z" />
            </svg>
          </div>
          <h2 className="ep-title">ویرایش مقاله</h2>
          <p className="ep-subtitle">تغییرات خود را اعمال و ذخیره کنید</p>
        </div>

        {/* ── Alerts ── */}
        {/* Conditionally render error or success feedback banners */}
        {pageStatus.error   && <div className="ep-alert ep-alert-error">{pageStatus.error}</div>}
        {pageStatus.success && <div className="ep-alert ep-alert-success">{pageStatus.success}</div>}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="ep-form">

          {/* Post title field */}
          <div className="ep-field">
            <label className="ep-label">عنوان مقاله</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="عنوان مقاله را بنویسید..."
              className="ep-input"
            />
          </div>

          {/* Rich-text body editor (Quill) */}
          <div className="ep-field">
            <label className="ep-label">متن مقاله</label>
            <div className="ep-editor-wrap">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={formData.body}
                onChange={handleEditorChange}
                modules={modules}
                className="ep-editor"
                dir="rtl"
              />
            </div>
          </div>

          {/* Status selector and thumbnail uploader side by side */}
          <div className="ep-row">

            {/* Publication status: public or private */}
            <div className="ep-field">
              <label className="ep-label">وضعیت انتشار</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="ep-input"
              >
                <option value="public">🌐 عمومی</option>
                <option value="private">🔒 خصوصی</option>
              </select>
            </div>

            {/* Cover image: shows existing thumbnail preview until a new file is chosen */}
            <div className="ep-field">
              <label className="ep-label">
                تصویر کاور{" "}
                <span className="ep-optional">(اختیاری)</span>
              </label>

              {/* Display the current server-stored thumbnail when no new file is staged */}
              {currentImage && !formData.thumbnail && (
                <div className="ep-preview-wrap">
                  <img
                    src={`${currentImage}`}
                    alt="تصویر فعلی"
                    className="ep-preview-img"
                  />
                  <span className="ep-preview-label">تصویر فعلی</span>
                </div>
              )}

              {/* Custom-styled file input; shows selected filename once chosen */}
              <label className="ep-file-label">
                {/* Upload / arrow-up icon */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                  viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5
                       A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3
                       m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                <span>
                  {formData.thumbnail
                    ? formData.thumbnail.name   // Show the chosen file's name
                    : "انتخاب تصویر جدید..."}
                </span>
                {/* Hidden native file input, triggered by the styled label above */}
                <input
                  type="file"
                  name="thumbnail"
                  onChange={handleChange}
                  accept="image/*"
                  className="ep-file-input"
                />
              </label>
              <small className="ep-hint">
                اگر عکسی انتخاب نکنید، همان عکس قبلی باقی می‌ماند.
              </small>
            </div>
          </div>

          {/* Form action buttons: save changes or cancel and go back */}
          <div className="ep-actions">
            <button
              type="submit"
              disabled={pageStatus.saving}
              className="ep-btn-submit"
            >
              {/* Show a spinner and different label while the request is in flight */}
              {pageStatus.saving ? (
                <>
                  <span className="ep-btn-spinner" />
                  در حال ذخیره...
                </>
              ) : (
                <>
                  {/* Checkmark icon for the idle save button */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                  </svg>
                  ذخیره تغییرات
                </>
              )}
            </button>

            {/* Cancel button: discards unsaved changes and returns to the dashboard */}
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="ep-btn-cancel"
            >
              {/* Back-arrow icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
              </svg>
              انصراف و بازگشت
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
