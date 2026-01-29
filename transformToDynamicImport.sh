find out/ | grep -E 'js$' | xargs -I {} sed -i.bak 's|require("@trustify-da/trustify-da-javascript-client")|import("@trustify-da/trustify-da-javascript-client")|g' {} && find out/ -name "*.bak" -delete
find out/ | grep -E 'js$' | xargs -I {} sed -i.bak 's|require("openid-client")|import("openid-client")|g' {} && find out/ -name "*.bak" -delete
