export enum deviceType {
    MOBILE = "MOBILE",
    TAB = "TAB",
    LAPTOP = "LAPTOP",
    COMPUTER = "COMPUTER"
}


export interface JwtPayload {
    userId: string,
    loginId: string,
    deviceId: string
}