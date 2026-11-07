#!/usr/bin/env perl
use strict;
use warnings;
use feature 'say';

# Dimensia Perl - sample calculation
my @numbers = (1, 2, 3, 4, 5);
my $total = 0;
$total += $_ for @numbers;
say "Merhaba Dimensia Perl!";
say "Toplam: $total";
