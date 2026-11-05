"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deletePost, getDashboardPosts } from "../services/api";

export default function DashboardPage() {
    const router = useRouter();

    // Store dashboard posts
    const [posts, setPosts] = useState([]);

    // Store logged-in user's display name
    const [userName, setUserName] = useState("کاربر عزیز");

    // Loading state for API requests
    const [isLoading, setIsLoading] = useState(true);

    // Error message state
    const [error, setError] = useState("");

    // Check authentication and load posts on page mount
    useEffect(() => {
        const token =
            localStorage.getItem("token") ||
            sessionStorage.getItem("token");

        // Redirect to login page if no token exists
        if (!token) {
            router.push("/login");
            return;
        }

        fetchPosts();
    }, [router]);

    // Fetch dashboard posts from API
    const fetchPosts = async () => {
        setIsLoading(true);

        const token =
            localStorage.getItem("token") ||
            sessionStorage.getItem("token");

        try {
            const data = await getDashboardPosts(token);

            // Extract posts array safely
            const fetchedPosts = data.posts || [];
            setPosts(fetchedPosts);

            // Set user name from API response if available
            if (data.fullname) {
                setUserName(data.fullname);
            }
            // Fallback: get user name from first post
            else if (
                fetchedPosts.length > 0 &&
                fetchedPosts[0].user?.fullname
            ) {
                setUserName(fetchedPosts[0].user.fullname);
            }
        } catch (err) {
            // Extract error message safely
            const errorMessage = err.message || "";

            // Handle authentication-related errors
            if (
                errorMessage.includes("jwt expired") ||
                errorMessage.includes("Unauthorized") ||
                errorMessage.includes("Not authenticated") ||
                err.status === 401
            ) {
                // Remove stored authentication tokens
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");

                // Redirect user to login page
                router.push("/login");
            } else {
                // Show other API errors
                setError(errorMessage || "خطا در دریافت لیست مقالات");
            }
        } finally {
            // Stop loading spinner
            setIsLoading(false);
        }
    };

    // Delete selected post
    const handleDelete = async (slug) => {
        // Show confirmation dialog before deleting
        if (!window.confirm("آیا از حذف این مقاله اطمینان دارید؟")) return;

        const token =
            localStorage.getItem("token") ||
            sessionStorage.getItem("token");

        try {
            // Call delete API
            await deletePost(token, slug);

            // Remove deleted post from local state
            setPosts(posts.filter((post) => post.slug !== slug));

            alert("مقاله با موفقیت حذف شد.");
        } catch (err) {
            alert(err.message || "خطا در حذف مقاله");
        }
    };

    // Logout current user
    const handleLogout = () => {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        router.push("/login");
    };

    return (
        <div
            className="container mx-auto p-4 max-w-5xl mt-10"
            dir="rtl"
        >

            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        پیشخوان مدیریت
                    </h1>

                    <p className="text-gray-500 text-sm">
                        خوش آمدید،
                        <span className="font-semibold text-gray-700">
                            {userName}
                        </span>
                    </p>
                </div>

                {/* Header Action Buttons */}
                <div className="flex gap-3 mt-4 md:mt-0">

                    {/* Create New Post */}
                    <Link
                        href="/dashboard/add-post"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded shadow transition-colors no-underline"
                    >
                        + مقاله جدید
                    </Link>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded shadow transition-colors"
                    >
                        خروج
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="text-center mt-20 text-xl text-gray-600">
                    در حال بارگذاری...
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="text-center mt-20 text-red-500">
                    {error}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && posts.length === 0 ? (
                <div className="text-center mt-20 text-gray-500 bg-white p-10 rounded-lg shadow-lg">
                    شما هنوز مقاله‌ای ثبت نکرده‌اید.
                </div>
            ) : (
                !isLoading &&
                !error && (

                    /* Posts Table */
                    <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
                        <table className="w-full text-right border-collapse">

                            {/* Table Header */}
                            <thead className="bg-gray-100 text-gray-700 border-b">
                                <tr>
                                    <th className="p-4 font-semibold">تصویر</th>
                                    <th className="p-4 font-semibold">عنوان مقاله</th>
                                    <th className="p-4 font-semibold">تاریخ ایجاد</th>
                                    <th className="p-4 font-semibold">وضعیت</th>
                                    <th className="p-4 font-semibold text-center">
                                        عملیات
                                    </th>
                                </tr>
                            </thead>

                            {/* Posts List */}
                            <tbody>
                                {posts.map((post) => (
                                    <tr
                                        key={post._id}
                                        className="border-b hover:bg-gray-50 transition-colors"
                                    >

                                        {/* Thumbnail Column */}
                                        <td className="p-4">
                                            <img
                                                src={`${post.thumbnail}`}
                                                alt={post.title}
                                                className="w-16 h-16 object-cover rounded shadow-sm"
                                            />
                                        </td>

                                        {/* Post Title */}
                                        <td className="p-4 font-medium text-gray-800">
                                            {post.title}
                                        </td>

                                        {/* Creation Date */}
                                        <td className="p-4 text-gray-500 text-sm">
                                            {new Date(
                                                post.createdAt
                                            ).toLocaleDateString("fa-IR")}
                                        </td>

                                        {/* Post Status */}
                                        <td className="p-4">
                                            <span
                                                className={`px-2 py-1 rounded text-xs text-white ${
                                                    post.status === "public"
                                                        ? "bg-green-500"
                                                        : "bg-yellow-500"
                                                }`}
                                            >
                                                {post.status === "public"
                                                    ? "عمومی"
                                                    : "پیش‌نویس"}
                                            </span>
                                        </td>

                                        {/* Action Buttons */}
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">

                                                {/* View Post Button */}
                                                <Link
                                                    href={`/post/${post.slug}`}
                                                    title="مشاهده"
                                                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded transition-colors"
                                                >
                                                    {/* Eye Icon */}
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.5}
                                                        stroke="currentColor"
                                                        className="w-5 h-5"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                        />
                                                    </svg>
                                                </Link>

                                                {/* Edit Post Button */}
                                                <Link
                                                    href={`/dashboard/edit-post/${post.slug}`}
                                                    title="ویرایش"
                                                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-800 rounded transition-colors"
                                                >
                                                    {/* Edit Icon */}
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.5}
                                                        stroke="currentColor"
                                                        className="w-5 h-5"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                                        />
                                                    </svg>
                                                </Link>

                                                {/* Delete Post Button */}
                                                <button
                                                    onClick={() =>
                                                        handleDelete(post.slug)
                                                    }
                                                    title="حذف"
                                                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 rounded transition-colors"
                                                >
                                                    {/* Trash Icon */}
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.5}
                                                        stroke="currentColor"
                                                        className="w-5 h-5"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79"
                                                        />
                                                    </svg>
                                                </button>

                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    </div>
                )
            )}
        </div>
    );
}
