(*
 * B Interpreter
 *)
open Pp
open B
let main () =
    let print_code = ref false in
    let src = ref "" in
    let spec = [("-pp", Arg.Set print_code, "입력 B 프로그램 찍어보기")] in
    let usage = "사용법: run <options> <file> \n사용 가능한 옵션들: " in
    let _ = Arg.parse spec
                (fun
                   x ->
                     if Sys.file_exists x then src := x
                     else raise (Arg.Bad (x ^ ": 파일이 없음")))
                usage
    in
    
	if !src = "" then Arg.usage spec usage
    else
    	let file_channel = open_in !src in
    	let lexbuf = Lexing.from_channel file_channel in
    	let pgm = Parser.program Lexer.start lexbuf in
		try
       		if !print_code then (
              print_endline "== 입력 프로그램 ==";
              B_PP.pp pgm
          	) else (
				try
          		   (ignore (B.run (B.emptyMemory, B.emptyEnv, pgm)))
				with
                	B.Error s -> print_endline ("오류: " ^ s)
          )
		with Lexer.LexicalError -> print_endline (!src ^ ": 문법 오류")

let _ = main ()
