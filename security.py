from urllib.parse import urlparse
from urllib.parse import parse_qs

from flask import request
from flask import redirect
from flask import g
from flask import flash
from flask_appbuilder.security.views import AuthDBView
from flask_appbuilder.security.views import expose
from flask_appbuilder.security.sqla.models import User, Role
from superset.security import SupersetSecurityManager
from flask_login import login_user
from flask_login import logout_user

from json import dumps


class CustomAuthDBView(AuthDBView):
    # login_template = "appbuilder/general/security/login_db.html"

    @expose("/login", methods=['GET', 'POST'])
    def login(self):
        next_url = request.args.get("next")

        if not next_url:
            return super(CustomAuthDBView, self).login()

        redirect_url = self.appbuilder.get_url_for_index
        if request.args.get('redirect') is not None:
            redirect_url = request.args.get('redirect')

        p = urlparse(next_url)
        qs = parse_qs(p.query)
        print("qs ", next_url)

        token_list = qs.get('token')
        username = token_list[0] if token_list else None
        # TODO(BY46): 验证token合法性
        if username is not None:
            print("username ", username, token_list[0])
            user = self.appbuilder.sm.find_user(username=username)  # type: User
            if not user:
                role = self.appbuilder.sm.find_role("Admin")
                user = self.appbuilder.sm.add_user(username, username, username,
                                                   username + "@tabe.cn", role,
                                                   password="emtpy")
            if user:
                print('user ', user.roles[0].permissions, user.to_json())
                login_user(user)
                return redirect(redirect_url)
        elif g.user is not None and g.user.is_authenticated:
            return redirect(redirect_url)
        else:
            flash("unable to auth login", 'warning')
            return super(CustomAuthDBView, self).login()


class CustomSecurityManager(SupersetSecurityManager):
    authdbview = CustomAuthDBView

    def __init__(self, appbuilder):
        super(CustomSecurityManager, self).__init__(appbuilder)
