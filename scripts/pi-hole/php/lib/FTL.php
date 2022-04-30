<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */
namespace pihole;

class FTL {

	private $piholeFTLConfFile = "/etc/pihole/pihole-FTL.conf";

    public $piholeFTLConfig = [];

    private $socket;

    public function __construct($address = '127.0.0.1', $port = 4711, $pathToConfig = null)
    {
        if (null !== $pathToConfig)
            $this->piholeFTLConfFile = $pathToConfig;

        $this->socket = $this->connectFTL($address, $port);
    }

    /**
     * @return array
     */
	function piholeFTLConfig()
	{
		if(count($this->piholeFTLConfig) > 0)
		{
			return $this->piholeFTLConfig;
		}

		if(is_readable($this->piholeFTLConfFile))
		{
			$this->piholeFTLConfig = parse_ini_file($this->piholeFTLConfFile);
		}

		return $this->piholeFTLConfig;
	}

	function connectFTL($address, $port=4711)
	{
		if($address == "127.0.0.1")
		{
			$config = $this->piholeFTLConfig();
			// Read port
			$portfileName = isset($config['PORTFILE']) ? $config['PORTFILE'] : '';
			if ($portfileName != '')
			{
				$portfileContents = file_get_contents($portfileName);
				if(is_numeric($portfileContents))
					$port = intval($portfileContents);
			}
		}

		// Open Internet socket connection
        return @fsockopen($address, $port, $errno, $errstr, 1.0);
	}

	function sendRequestFTL($requestin)
	{
		$request = ">".$requestin;
		fwrite($this->socket, $request) or die('{"error":"Could not send data to server"}');
	}

	function getResponseFTL()
	{
		$response = [];

		$errCount = 0;
		while(true)
		{
			$out = fgets($this->socket);
			if ($out == "") $errCount++;
			if ($errCount > 100) {
				// Tried 100 times, but never got proper reply, fail to prevent busy loop
				die('{"error":"Tried 100 times to connect to FTL server, but never got proper reply. Please check Port and logs!"}');
			}
			if(strrpos($out,"---EOM---") !== false)
				break;

			$out = rtrim($out);
			if(strlen($out) > 0)
				$response[] = $out;
		}

		return $response;
	}

	function disconnectFTL()
	{
		fclose($this->socket);
	}
}
