"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

// URL-driven search box component.
// Stores the search term as a "filter" query parameter in the URL so that
// the search state is shareable, bookmarkable, and survives page refreshes.
export default function SearchBox() {

    // Read the current URL query parameters (e.g. ?filter=something)
    const searchParams = useSearchParams();

    // Get the current pathname so we can rebuild the URL without changing the route
    const pathname = usePathname();

    // Use replace (not push) to update the URL without adding a new browser history entry
    const { replace } = useRouter();

    // Debounced handler: waits 300ms after the user stops typing before updating the URL,
    // preventing a URL update and potential re-fetch on every single keystroke
    const handleSearch = useDebouncedCallback((term) => {

        // Clone the existing query params to preserve any other params in the URL
        const params = new URLSearchParams(searchParams);

        if (term) {
            // Set or update the filter param with the current search term
            params.set("filter", term);
        } else {
            // Remove the filter param entirely when the input is cleared
            params.delete("filter");
        }

        // Replace the current URL with the updated query string;
        // scroll: false prevents the page from jumping to the top on each keystroke
        replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);

    return (
        <section className="search-section mt-5 py-5">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-8 col-md-10">
                        <div className="search-container shadow-sm border">
                            <div className="row g-0 align-items-center">

                                {/* Search / magnifier icon on the left side of the input */}
                                <div className="col-auto ps-3 text-muted">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398l3.85 3.85a1 1 0 0 0 1.415-1.414z" />
                                    </svg>
                                </div>

                                {/* Text input: uses defaultValue (uncontrolled) so the field is pre-filled
                                    from the URL on load without fighting React's controlled-input cycle */}
                                <div className="col">
                                    <input
                                        type="text"
                                        className="main-search-input w-full py-2 px-3 border-none outline-none"
                                        placeholder="جستجو در سایت..."
                                        defaultValue={searchParams.get("filter")?.toString() || ""}
                                        onChange={(e) => handleSearch(e.target.value)}
                                    />
                                </div>

                                {/* Search action button on the right side of the input */}
                                <div className="col-auto pe-2">
                                    <button type="button" className="btn btn-search-action">
                                        جستجو
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}