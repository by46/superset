from functools import partial

from typing import Any
from flask import g
from superset.jinja_context import JinjaTemplateProcessor
from superset.jinja_context import safe_proxy


class ExtraCache(object):
    def __init__(self):
        pass

    def current_tenant_code(self):
        if hasattr(g, 'user') and g.user:
            return 1


class MySQLTemplateProcessor(JinjaTemplateProcessor):
    engine = "mysql"

    def set_context(self, **kwargs: Any) -> None:
        extra_cache = ExtraCache()
        super().set_context(**kwargs)
        self._context[self.engine] = {
            "current_tenant_code": partial(safe_proxy, extra_cache.current_tenant_code)
        }

class SqliteTemplateProcessor(JinjaTemplateProcessor):
    engine = "sqlite"

    def set_context(self, **kwargs: Any) -> None:
        super().set_context(**kwargs)

        extra_cache = ExtraCache()
        self._context[self.engine] = {
            "current_tenant_code": partial(safe_proxy, extra_cache.current_tenant_code)
        }
