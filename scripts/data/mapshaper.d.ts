// mapshaper는 타입 정보가 없어서, 이 프로젝트에서 쓰는 함수만 적어 둔다
declare module "mapshaper" {
  interface Mapshaper {
    // 명령을 실행하고, -o로 만든 파일을 { 파일 이름: 내용 }으로 돌려준다
    applyCommands(commands: string, input: Record<string, string>): Promise<Record<string, string | Buffer>>;
  }

  const mapshaper: Mapshaper;
  export default mapshaper;
}
