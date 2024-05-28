import { h } from '#/utils/h'

import { login, loginVerify } from './login'
import { register, registerVerify } from './register'

export const authRoute = h()
  .route('/login', login)
  .route('/register', register)
  .route('/login/verify', loginVerify)
  .route('/register/verify', registerVerify)
