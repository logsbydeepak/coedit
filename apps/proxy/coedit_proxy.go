package coedit_proxy

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/caddyserver/caddy/v2"
	"github.com/caddyserver/caddy/v2/caddyconfig/caddyfile"
	"github.com/caddyserver/caddy/v2/caddyconfig/httpcaddyfile"
	"github.com/caddyserver/caddy/v2/modules/caddyhttp"
	"github.com/jellydator/ttlcache/v3"
	"github.com/redis/go-redis/v9"

	"go.uber.org/zap"
)

var ctx = context.Background()
var cache = ttlcache.New[string, string](
	ttlcache.WithTTL[string, string](30 * time.Minute),
)

func init() {
	caddy.RegisterModule(Middleware{})
	httpcaddyfile.RegisterHandlerDirective("coedit_proxy", parseCaddyfile)
}

type Middleware struct {
	ENV struct {
		ROOT_DOMAIN string
		REDIS_URL   string
	}
	logger *zap.Logger
	redis  *redis.Client
}

func (Middleware) CaddyModule() caddy.ModuleInfo {
	return caddy.ModuleInfo{
		ID:  "http.handlers.coedit_proxy",
		New: func() caddy.Module { return new(Middleware) },
	}
}

func (m Middleware) ServeHTTP(w http.ResponseWriter, r *http.Request, next caddyhttp.Handler) error {
	m.logger.Info("<- " + r.Host)
	host := r.Host
	port := -1

	if !strings.HasSuffix(host, "-app."+m.ENV.ROOT_DOMAIN) && !strings.HasSuffix(host, "-server."+m.ENV.ROOT_DOMAIN) {
		caddyhttp.SetVar(r.Context(), "shard.upstream", "not_found")
		return next.ServeHTTP(w, r)
	}

	if strings.HasSuffix(host, "-server."+m.ENV.ROOT_DOMAIN) {
		port = 8000
	}

	if strings.HasSuffix(host, "-app."+m.ENV.ROOT_DOMAIN) {
		port = 3000
	}

	host = strings.Split(host, ".")[0]

	if strings.HasSuffix(host, "-app") {
		host = strings.ReplaceAll(host, "-app", "")
	}

	if strings.HasSuffix(host, "-server") {
		host = strings.ReplaceAll(host, "-server", "")
	}

	if strings.Count(host, "-") != 1 {
		caddyhttp.SetVar(r.Context(), "shard.upstream", "not_found")
		return next.ServeHTTP(w, r)
	}

	if result := cache.Get(host); result != nil {
		m.logger.Info("CACHE HIT")
		m.logger.Info("-> " + result.Value())
		caddyhttp.SetVar(r.Context(), "shard.upstream", result.Value())
		return next.ServeHTTP(w, r)
	}

	m.logger.Info("CACHE MISS")
	ip, err := m.redis.Get(ctx, "CONTAINER_IP-"+host).Result()

	if err != nil {
		m.logger.Error(err.Error())
		caddyhttp.SetVar(r.Context(), "shard.upstream", "not_found")
		return next.ServeHTTP(w, r)
	} else {
		port = 5002
		if port == -1 {
			caddyhttp.SetVar(r.Context(), "shard.upstream", "not_found")
			return next.ServeHTTP(w, r)
		}

		ip = strings.Split(ip, ":")[0]
		url := ip + fmt.Sprintf(":%v", port)
		m.logger.Info("-> " + url)
		caddyhttp.SetVar(r.Context(), "shard.upstream", url)
		cache.Set(host, url, ttlcache.DefaultTTL)
		return next.ServeHTTP(w, r)
	}
}

func (m *Middleware) Provision(c caddy.Context) error {
	m.logger = c.Logger()

	opt, err := redis.ParseURL(m.ENV.REDIS_URL)
	if err != nil {
		return err
	}

	m.redis = redis.NewClient(opt)
	err = m.redis.Ping(ctx).Err()
	if err != nil {
		return err
	}

	go cache.Start()
	return nil
}

func (m *Middleware) UnmarshalCaddyfile(d *caddyfile.Dispenser) error {
	d.Next()

	if !d.NextArg() {
		return fmt.Errorf("Missing env: ROOT_DOMAIN")
	}
	m.ENV.ROOT_DOMAIN = d.Val()

	if !d.NextArg() {
		return fmt.Errorf("Missing env: REDIS_URL")
	}
	m.ENV.REDIS_URL = d.Val()
	return nil
}

func parseCaddyfile(h httpcaddyfile.Helper) (caddyhttp.MiddlewareHandler, error) {
	var m Middleware
	err := m.UnmarshalCaddyfile(h.Dispenser)
	return m, err
}
