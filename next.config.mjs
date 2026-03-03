/** @type {import('next').NextConfig} */
const nextConfig = {
    optimizeFonts: false,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'remagent.com',
                pathname: '**',
            }
        ],
    },
    env: {
        SITE_URL: "https://app.remagent.com",
        API_URL: "https://remagent.com/api",
        SITE_LOGO: "/assets/images/logo/logo.png",
        SITE_LOGO1: "/assets/images/logo/logo1.png",
        SITE_TITLE: "REMAGENT | Empowering Career Growth with Strategic Talent Solutions",
        SITE_DESCRIPTION:
            "Discover growth opportunities with REMAGENT. We specialize in connecting top talent with companies seeking to unlock potential through strategic hiring and development. Explore our positions for growth and drive your career forward.",
        SITE_KEYWORDS:
            "career growth opportunities",
        DUMMY_IMAGE:"/assets/images/home/60111.jpg",
        REMAGENT_URL:"https://remagent.com",
        MOBILE_NO:"+1 888 299 8984",
        EMAIL:"remagnet123@gmail.com"
    },
};

export default nextConfig;
