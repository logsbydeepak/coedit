package coedit_proxy

import (
	"fmt"
	"net/http"

	"github.com/caddyserver/caddy/v2"
	"github.com/caddyserver/caddy/v2/caddyconfig/httpcaddyfile"
	"github.com/caddyserver/caddy/v2/modules/caddyhttp"
)

func init() {
	caddy.RegisterModule(JWTShardRouter{})
	httpcaddyfile.RegisterHandlerDirective("coedit_proxy", jwtParseCaddyfile)
}

type JWTShardRouter struct {
}

func (JWTShardRouter) CaddyModule() caddy.ModuleInfo {
	return caddy.ModuleInfo{
		ID:  "http.handlers.coedit_proxy",
		New: func() caddy.Module { return new(JWTShardRouter) },
	}
}

func (m JWTShardRouter) ServeHTTP(w http.ResponseWriter, r *http.Request, next caddyhttp.Handler) error {
	fmt.Println(r.Host)
	shard := "127.0.0.1:5002"
	caddyhttp.SetVar(r.Context(), "shard.upstream", shard)

	return next.ServeHTTP(w, r)
}

func jwtParseCaddyfile(h httpcaddyfile.Helper) (caddyhttp.MiddlewareHandler, error) {
	var m JWTShardRouter
	return m, nil
}
