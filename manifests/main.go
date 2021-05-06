package main

import (
	"fmt"

	_ "code.cloudfoundry.org/archiver/extractor"
	_ "github.com/googleapis/gax-go"
	_ "github.com/googleapis/gax-go/v2"
	_ "github.com/slackhq/nebula"
	_ "github.com/slackhq/nebula/cert"
)

func main() {
	fmt.Println("vim-go")
}
