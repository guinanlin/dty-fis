/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdfkit"],
  // Dev 模式经反向代理（frp/nginx）以公网域名访问时，Next 默认只放行
  // localhost/127.0.0.1 来源；跨域 Origin 的 chunk / HMR WebSocket 请求会被
  // 403 拦截，导致页面 JS 不加载、不水合、表单退化为原生提交。
  // 这里显式放行公网域名（可用 ALLOWED_DEV_ORIGINS 追加更多来源）。
  allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGINS ?? "fis.st.datangyuan.cn")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};

export default nextConfig;
