export interface LoginResponse {
  status: string;
  message: string;
  user?: {
    username: string;
    isAdmin?: boolean;
  };
}

export const loginResponse: LoginResponse = {
  status: "success",
  message: "login successful",
};

export default loginResponse;
