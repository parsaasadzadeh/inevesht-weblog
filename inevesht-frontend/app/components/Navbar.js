import Link from "next/link";




export default function Navbar() {
    return (
        <nav dir="ltr" className="navbar navbar-expand-lg sticky-top">
            <div className="container">

                <Link className="navbar-brand" href="/">
                    inev<span style={{ color: 'var(--primary-color)' }}>sht</span>
                </Link>

                <button
                    className="navbar-toggler border-0 shadow-none"
                    type="button"
                    data-bs-toggle="offcanvas"
                    data-bs-target="#mainMenu"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="offcanvas offcanvas-end" id="mainMenu" tabIndex="-1">
                    <div className="offcanvas-header">
                        <button
                            type="button"
                            className="btn-close shadow-none"
                            data-bs-dismiss="offcanvas"
                        ></button>
                    </div>

                    <div className="offcanvas-body">
                        <ul className="navbar-nav text-center mx-auto">

                            <li className="nav-item">
                                <Link className="nav-link" href="/">
                                    <i className="fa-solid fa-house me-2"></i>
                                    صفحه اصلی
                                </Link>
                            </li>

                            <li className="nav-item">
                                <Link className="nav-link" href="/contact">
                                    <i className="fa-solid fa-phone me-2"></i>
                                    تماس با ما
                                </Link>
                            </li>

                            <li className="nav-item">
                                <Link className="nav-link" href="/register">
                                    <i className="fa-solid fa-user-plus me-2"></i>
                                    ثبت نام
                                </Link>
                            </li>

                            <li className="nav-item">
                                <Link className="nav-link" href="/dashboard">
                                    <i className="fa-solid fa-chart-line me-2"></i>
                                    داشبورد
                                </Link>
                            </li>

                        </ul>

                        <div className="d-flex align-items-center gap-2 mobile-actions">
                            <Link href="/login" className="btn-auth">
                                <i className="fa-solid fa-user me-2"></i>
                                <span>ورود کاربر</span>
                            </Link>
                        </div>

                    </div>
                </div>
            </div>
        </nav>
    );
}
