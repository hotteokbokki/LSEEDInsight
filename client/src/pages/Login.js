import React, { useState } from 'react';
import '../styles/Login.css';

const Login = () => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const signInWithGoogle = () => {
    alert('Google Sign-In functionality goes here.');
  };

  return (
    <div className="container">
      <input
        type="checkbox"
        id="flip"
        checked={isFlipped}
        onChange={handleFlip}
        style={{ display: 'none' }}
      />
      <div className="cover">
        <div className="front">
          <img src="frontphot.png" alt="Welcome" />
          <div className="text">
            <span className="text-1">
              <h4>WELCOME TO</h4>
              <h2>LSEED Insight</h2>
            </span>
            <span className="text-2">Let's get started</span>
          </div>
        </div>
        <div className="back">
          <img src="backphot.png" alt="Join Us" />
          <div className="text">
            <span className="text-1">
              Want to become part of the <br /> Team?
            </span>
          </div>
        </div>
      </div>

      <div className="forms">
        <div className="form-content">
          {!isFlipped ? (
            <div className="login-form">
              <div className="title">
                <h2>LOGIN</h2>
              </div>
              <form method="post" action="php/check_loginform.php">
                <div className="input-boxes">
                  <div className="input-box">
                    <i className="fas fa-envelope"></i>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div className="input-box">
                    <i className="fas fa-lock"></i>
                    <input
                      type="password"
                      name="password"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  <div className="text">
                    <a href="forgot-password.php">Forgot password?</a>
                  </div>
                  <div className="button input-box">
                    <input type="submit" value="Log-In" />
                  </div>
                  <div className="separator">OR</div>
                  <div className="google-btn" onClick={signInWithGoogle}>
                    <div className="google-icon-wrapper">
                      <i className="fab fa-google"></i>
                    </div>
                    <p className="btn-text">Sign in with Google</p>
                  </div>
                  <div className="text sign-up-text">
                    Don't have an account?{' '}
                    <label htmlFor="flip">Sign up now</label>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="signup-form">
              <div className="title">
                <h2>SIGN UP</h2>
              </div>
              <form method="post" action="php/register_user.php">
                <div className="input-boxes">
                  <div className="input-box">
                    <i className="fas fa-user"></i>
                    <input
                      type="text"
                      name="first_name"
                      placeholder="Enter your first name"
                      required
                    />
                  </div>
                  <div className="input-box">
                    <i className="fas fa-user"></i>
                    <input
                      type="text"
                      name="last_name"
                      placeholder="Enter your last name"
                      required
                    />
                  </div>
                  <div className="input-box">
                    <i className="fas fa-phone"></i>
                    <input
                      type="text"
                      name="phone"
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                  <div className="input-box">
                    <i className="fas fa-envelope"></i>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div className="checkbox-wrapper terms-checkbox">
                    <input type="checkbox" id="terms" name="terms" required />
                    <label htmlFor="terms">
                      <a href="#" onClick={(e) => e.preventDefault()}>
                        Terms and Conditions
                      </a>
                    </label>
                  </div>
                  <div className="button input-box">
                    <input type="submit" value="Register" />
                  </div>
                  <div className="separator">OR</div>
                  <div className="google-btn" onClick={signInWithGoogle}>
                    <div className="google-icon-wrapper">
                      <i className="fab fa-google"></i>
                    </div>
                    <p className="btn-text">Sign up with Google</p>
                  </div>
                  <div className="text sign-up-text">
                    Already have an account?{' '}
                    <label htmlFor="flip">Login now</label>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
