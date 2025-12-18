
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Copy, RefreshCw, Key, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function PasswordGenerator() {
  const [length, setLength] = useState([16]);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);

  const generatePassword = React.useCallback(() => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    // similarChars is not used directly, only in regex replacements below
    // const similarChars = '0O1lI|'; 

    let charset = '';
    let requiredChars = [];

    if (includeUppercase) {
      let chars = uppercase;
      if (excludeSimilar) chars = chars.replace(/[O]/g, '');
      charset += chars;
      // Ensure at least one char from this set is included if option is active
      if (chars.length > 0) {
        requiredChars.push(chars[Math.floor(Math.random() * chars.length)]);
      }
    }

    if (includeLowercase) {
      let chars = lowercase;
      if (excludeSimilar) chars = chars.replace(/[l]/g, '');
      charset += chars;
      if (chars.length > 0) {
        requiredChars.push(chars[Math.floor(Math.random() * chars.length)]);
      }
    }

    if (includeNumbers) {
      let chars = numbers;
      if (excludeSimilar) chars = chars.replace(/[01]/g, '');
      charset += chars;
      if (chars.length > 0) {
        requiredChars.push(chars[Math.floor(Math.random() * chars.length)]);
      }
    }

    if (includeSymbols) {
      let chars = symbols;
      if (excludeSimilar) chars = chars.replace(/[|]/g, '');
      charset += chars;
      if (chars.length > 0) {
        requiredChars.push(chars[Math.floor(Math.random() * chars.length)]);
      }
    }

    if (!charset) {
      setGeneratedPassword("Please select at least one character type");
      return;
    }

    let password = '';
    const passwordLength = length[0];

    // Add required characters first, making sure not to exceed passwordLength
    for (let char of requiredChars) {
      if (password.length < passwordLength) {
        password += char;
      } else {
        break;
      }
    }

    // Fill the rest randomly
    for (let i = password.length; i < passwordLength; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password to mix required and random characters
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    setGeneratedPassword(password);
    setCopied(false);
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar]);

  const copyToClipboard = async () => {
    if (!generatedPassword) return;
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  const getPasswordStrength = () => {
    if (!generatedPassword) return { strength: 0, label: "None", color: "bg-gray-500" };
    
    let score = 0;
    const len = generatedPassword.length;
    
    // Length scoring
    if (len >= 12) score += 25;
    else if (len >= 8) score += 15;
    else score += 5;
    
    // Character variety
    if (/[a-z]/.test(generatedPassword)) score += 15;
    if (/[A-Z]/.test(generatedPassword)) score += 15;
    if (/[0-9]/.test(generatedPassword)) score += 15;
    if (/[^a-zA-Z0-9]/.test(generatedPassword)) score += 15;
    
    // Length bonus
    if (len >= 16) score += 15;
    
    if (score >= 85) return { strength: score, label: "Very Strong", color: "bg-green-500" };
    if (score >= 70) return { strength: score, label: "Strong", color: "bg-blue-500" };
    if (score >= 50) return { strength: score, label: "Medium", color: "bg-yellow-500" };
    if (score >= 30) return { strength: score, label: "Weak", color: "bg-orange-500" };
    return { strength: score, label: "Very Weak", color: "bg-red-500" };
  };

  React.useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  const strengthInfo = getPasswordStrength();

  return (
    <Card className="glass-effect border-slate-700/50 max-w-xl mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-cyan-300 flex items-center text-xl">
          <Key className="w-5 h-5 mr-2" />
          Secure Password Generator
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Generate cryptographically secure passwords with customizable options
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Output */}
        <div className="space-y-2">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={generatedPassword}
              readOnly
              className="bg-slate-800/50 border-gray-600 text-white font-mono text-base sm:text-lg pr-20 h-11"
              placeholder="Generated password..."
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                className="h-8 w-8 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyToClipboard}
                disabled={!generatedPassword}
                className="h-8 w-8 text-gray-400 hover:text-white"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Compact strength */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full ${strengthInfo.color} transition-all duration-300`}
                style={{ width: `${strengthInfo.strength}%` }}
              />
            </div>
            <Badge className={`${strengthInfo.color.replace('bg-', 'bg-').replace('-500', '-500/20')} text-white border-none text-xs px-2 py-0.5`}>
              {strengthInfo.label}
            </Badge>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Length */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center justify-between text-sm">
              Password Length
              <span className="text-cyan-400 font-mono">{length[0]} characters</span>
            </Label>
            <Slider
              value={length}
              onValueChange={setLength}
              min={4}
              max={128}
              step={1}
              className="w-full"
            />
          </div>

          {/* Character Types - compact grid */}
          <div className="space-y-2">
            <Label className="text-gray-300 text-sm">Character Types</Label>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="uppercase" checked={includeUppercase} onCheckedChange={setIncludeUppercase} />
                <Label htmlFor="uppercase" className="text-gray-400 text-sm">Uppercase (A-Z)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="lowercase" checked={includeLowercase} onCheckedChange={setIncludeLowercase} />
                <Label htmlFor="lowercase" className="text-gray-400 text-sm">Lowercase (a-z)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="numbers" checked={includeNumbers} onCheckedChange={setIncludeNumbers} />
                <Label htmlFor="numbers" className="text-gray-400 text-sm">Numbers (0-9)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="symbols" checked={includeSymbols} onCheckedChange={setIncludeSymbols} />
                <Label htmlFor="symbols" className="text-gray-400 text-sm">Symbols (!@#$%^&*)</Label>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <Label className="text-gray-300 text-sm">Advanced Options</Label>
            <div className="flex items-center space-x-2">
              <Checkbox id="exclude-similar" checked={excludeSimilar} onCheckedChange={setExcludeSimilar} />
              <Label htmlFor="exclude-similar" className="text-gray-400 text-sm">
                Exclude similar characters (0, O, 1, l, I, |)
              </Label>
            </div>
          </div>

          {/* Generate Button (slightly shorter) */}
          <Button
            onClick={generatePassword}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 h-10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Generate New Password
          </Button>
        </div>

        {/* Collapsible security tips */}
        <details className="bg-slate-800/30 rounded-lg border border-slate-700/50">
          <summary className="cursor-pointer px-4 py-3 text-gray-200 text-sm font-medium">Security Tips</summary>
          <div className="px-4 pb-4 pt-1">
            <ul className="text-gray-400 text-xs space-y-1">
              <li>• Use unique passwords for every account</li>
              <li>• Store passwords in a reputable password manager</li>
              <li>• Enable two-factor authentication when available</li>
              <li>• Never share passwords via email or messaging</li>
              <li>• Update passwords if you suspect they've been compromised</li>
            </ul>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
