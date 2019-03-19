# Surify

Generate suricata-rules from collection of IOCs (JSON, CSV or flags) based on your suricata template.

## Features

### Inputs
- CSV as input (only with header)
(_you have to manually set the delimiter_)
  - `$ surify c config.json --csv example.csv -d ";" -o suri_csv.rules --sid 1`
- JSON as input
  - `$ surify -c config.json --json example.json -o suri.rules`
- flags as input
  - `$ surify -c config.json --test1 1.2.3.4 --test2 9.9.9.9 --sid 120000 -o log`

### Outputs
- output to stdout 
  - `... -o log`
- output to file
  - `... -o suri.rules`

## Examples
### config.json
```JSON
{
    "template": {
        "suricata": {
            "path": "./suricata.template",
            "startVar": "{{",
            "endVar": "}}"
        }
    }
}
```

### suricata.template
```suricata
alert http {{test}} any -> {{test2}} any (msg: "Test 1"; sid: 1;)
alert http {{test2}} any -> {{test}} any (msg: "Test 2"; sid: 1;)
```