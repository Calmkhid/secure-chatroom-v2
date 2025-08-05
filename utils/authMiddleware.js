function ensureAuth(req, res, next) {
    console.log('ensureAuth check - session:', req.session ? 'exists' : 'null');
    console.log('ensureAuth check - user:', req.session && req.session.user ? req.session.user.username : 'no user');
    console.log('ensureAuth check - session ID:', req.session ? req.session.id : 'no session id');
    
    if (req.session && req.session.user) {
        console.log('User authenticated, proceeding to:', req.path);
        return next();
    }
    
    console.log('User not authenticated, redirecting to login');
    return res.redirect('/');
}

module.exports = { ensureAuth };