#!/usr/bin/env perl
use strict;
use warnings;
use feature 'say';
use JSON::PP;

my $text = "1 2 3 4 5";
if (-f 'code-lab/shared/numbers.txt') {
    open my $fh, '<', 'code-lab/shared/numbers.txt' or die "Cannot read fixture: $!";
    local $/;
    $text = <$fh>;
    close $fh;
}
my @numbers = grep { length } split /\s+/, $text;
my $total = 0;
for my $number (@numbers) {
    die "Invalid integer" unless $number =~ /^-?\d+$/;
    $total += $number;
}
say "Merhaba Dimensia Perl!";
say "Toplam: $total";
say "DIMENSIA_RESULT:" . encode_json({count => scalar(@numbers), sum => $total});
