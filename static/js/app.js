$('#signin').click(function() { navigator.id.request(); });
$('#signout').click(function() { navigator.id.logout(); });

navigator.id.watch({
  loggedInUser: user.email? user.email : null,
  onlogin: function(assertion) {
    $.ajax({
      type: 'POST',
      url: '/persona/verify',
      data: {assertion: assertion, _csrf: csrfToken},
      success: function(res, status, xhr) {
        if (res.status == "failure")
          alert("Sign in failure: " + res.reason);
        else
          window.location.reload(); },
      error: function(xhr, status, err) { alert("Login failure: " + err); }
    });
  },
  onlogout: function() {
    $.ajax({
      type: 'POST',
      url: '/persona/logout',
      data: {_csrf: csrfToken},
      success: function(res, status, xhr) { window.location.reload(); },
      error: function(xhr, status, err) { alert("Logout failure: " + err); }
    });
  }
});
