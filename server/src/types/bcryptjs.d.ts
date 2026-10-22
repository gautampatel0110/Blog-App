declare module "bcryptjs" {
  const bcrypt: {
    hash(value: string, rounds: number): Promise<string>;
    compare(value: string, encrypted: string): Promise<boolean>;
  };
  export default bcrypt;
}
