#this script adds the following necessary attributes to the training and test files
#event_nr
#whether the event is the last in the trace

files = c ("train_bpi12.csv", "test_bpi12.csv")
#files <- list.files()[grep(paste("^(?=.*\\.csv)",sep=''), list.files(), perl=TRUE)]

for (File in files) {
  
  dat = read.csv(File)
  dat$sequence_nr  = as.character(dat$sequence_nr)
  dat$event_nr = 1
  
  for(i in 2:nrow(dat)) {
    if(i%%100==0) print(i)
    if(dat$sequence_nr[i] == dat$sequence_nr[i-1]) dat$event_nr[i] = dat$event_nr[i-1]+1
    if(dat$sequence_nr[i] != dat$sequence_nr[i-1]) dat$event_nr[i] = 1
  }
  
  dat$last = "false"
  for(i in 2:nrow(dat)) {
    if(dat$sequence_nr[i] != dat$sequence_nr[i-1]) {
      dat$last[i-1] = "true"
      print(i)
    }
  }
  dat$last[nrow(dat)] = "true"
  
  write.csv(dat,File,quote = F,row.names = F)
}
