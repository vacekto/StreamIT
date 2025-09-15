export interface JwtPayload {
  id: string;
  username: string;
  email: string;
  tid: string;
}

export interface JwtPayloadExtended {
  id: string;
  username: string;
  email: string;
  tid: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
}
