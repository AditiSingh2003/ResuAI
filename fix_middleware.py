files = {
"middleware.js": '''\
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/",
    "/projects/:path*",
    "/settings/:path*",
  ],
};
'''
}

import os
for path, content in files.items():
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Written: {path}")
print("Done!")